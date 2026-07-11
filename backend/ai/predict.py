import sys
import json
import os
import numpy as np
import hashlib

def get_station_profile(station_id, station_name=""):
    """
    Determines unique demand profile type and parameters for a specific station
    using its ID or name so that every station has realistic and unique hourly dynamics.
    """
    if isinstance(station_id, (int, float)):
        seed_val = int(station_id)
    else:
        seed_val = int(hashlib.md5(str(station_id).encode('utf-8')).hexdigest()[:8], 16)
    
    # We define 3 distinct real-world fuel station demand patterns in Sri Lanka:
    # 1. Urban Commuter: Peaks during morning (7a-9a) and evening rush (5p-7p)
    # 2. Suburban Residential: Peaks mid-morning (9a-11a) and weekend afternoon (1p-4p)
    # 3. Highway / Transit: Moderate steady demand all day with noon peak (12p-2p)
    profile_type = seed_val % 3
    
    if profile_type == 0:
        # Urban Commuter base curve (Hours: 6a, 7a, 8a, 9a, 10a, 11a, 12p, 1p, 2p, 3p, 4p, 5p)
        base_curve = [20, 55, 75, 45, 30, 35, 45, 30, 25, 40, 65, 85]
        profile_name = "Urban Commuter Station"
    elif profile_type == 1:
        # Suburban Residential base curve
        base_curve = [15, 30, 50, 65, 70, 55, 40, 45, 55, 45, 35, 25]
        profile_name = "Suburban Residential Station"
    else:
        # Highway / Transit base curve
        base_curve = [25, 35, 45, 55, 60, 70, 80, 75, 65, 55, 45, 35]
        profile_name = "Highway / Transit Station"
        
    # Station-specific multiplier (between 0.8 and 1.25 based on station identity)
    multiplier = 0.8 + ((seed_val % 45) / 100.0)
    
    return profile_name, base_curve, multiplier, seed_val

def run_prediction(input_data):
    # Parse input fields
    if isinstance(input_data, dict):
        hour = float(input_data.get('hour', 12))
        day_of_week = float(input_data.get('dayOfWeek', 3))
        station_id = input_data.get('stationId', 1)
        station_name = input_data.get('stationName', '')
        current_queue = float(input_data.get('currentQueueCount', 15))
    elif isinstance(input_data, (list, tuple)):
        hour = float(input_data[0]) if len(input_data) > 0 else 12.0
        day_of_week = float(input_data[1]) if len(input_data) > 1 else 3.0
        station_id = input_data[2] if len(input_data) > 2 else 1
        current_queue = float(input_data[3]) if len(input_data) > 3 else 15.0
        station_name = str(input_data[4]) if len(input_data) > 4 else ''
    else:
        hour, day_of_week, station_id, current_queue, station_name = 12.0, 3.0, 1, 15.0, ''

    profile_name, base_curve, multiplier, seed_val = get_station_profile(station_id, station_name)

    # Check weekend adjustment (Day 0 = Sun, Day 6 = Sat)
    is_weekend = (day_of_week == 0 or day_of_week == 6)
    
    # Try running TFLite model for neural network baseline score
    model_score = None
    used_real_model = false_str = False
    model_path = os.path.join(os.path.dirname(__file__), 'fuel_queue_model.tflite')
    
    try:
        try:
            import tensorflow as tf
            Interpreter = tf.lite.Interpreter
        except ImportError:
            import tflite_runtime.interpreter as tflite
            Interpreter = tflite.Interpreter

        if os.path.exists(model_path):
            interpreter = Interpreter(model_path=model_path)
            interpreter.allocate_tensors()
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()
            expected_shape = input_details[0]['shape']
            expected_dtype = input_details[0]['dtype']
            total_elements = int(np.prod(expected_shape))
            
            numeric_sid = seed_val % 100
            features = [hour, day_of_week, float(numeric_sid), current_queue]
            while len(features) < total_elements:
                features.append(0.0)
            features = features[:total_elements]

            input_tensor = np.array(features, dtype=expected_dtype).reshape(expected_shape)
            interpreter.set_tensor(input_details[0]['index'], input_tensor)
            interpreter.invoke()
            output_data = interpreter.get_tensor(output_details[0]['index'])
            model_score = float(np.mean(output_data))
            used_real_model = True
    except Exception as e:
        # TFLite not available or failed, use heuristic algorithm
        pass

    # Generate the 12-hour specific forecast for this station
    # Hours correspond to: 6a, 7a, 8a, 9a, 10a, 11a, 12p, 1p, 2p, 3p, 4p, 5p
    hours_list = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    hourly_predictions = []
    
    # Current demand weight: if real-time queue count is much higher/lower than base curve for current hour,
    # we smoothly shift the curve to reflect live reality at the station.
    current_hour_int = int(hour)
    if current_hour_int in hours_list:
        idx_now = hours_list.index(current_hour_int)
        expected_now = base_curve[idx_now] * multiplier
        live_delta = current_queue - expected_now
    else:
        live_delta = (current_queue - 25.0) * 0.4

    for i, h in enumerate(hours_list):
        raw_val = base_curve[i] * multiplier
        
        # Add weekend variation if applicable
        if is_weekend:
            if h in [12, 13, 14, 15]: # Weekend afternoon bump
                raw_val *= 1.2
            elif h in [6, 7, 8]: # Weekend morning drop
                raw_val *= 0.75
        
        # Decay the live_delta effect as we forecast further from the current hour
        hour_diff = abs(h - hour)
        if hour_diff <= 3:
            influence = (3.0 - hour_diff) / 3.0 * (live_delta * 0.6)
        else:
            influence = 0.0
            
        final_val = raw_val + influence
        
        # Incorporate TFLite model score variance if available
        if model_score is not None and model_score > 0:
            model_adj = (model_score - 45.0) * 0.2
            final_val += model_adj
            
        # Clamp between realistic queue lengths (4 to 95 vehicles)
        final_val = max(4.0, min(95.0, round(final_val)))
        hourly_predictions.append(int(final_val))

    # Identify lowest queue hour (Best Time) and highest queue hour (Peak Rush)
    min_idx = int(np.argmin(hourly_predictions))
    max_idx = int(np.argmax(hourly_predictions))
    
    hour_labels = [
        '6:00 AM – 8:00 AM', '7:00 AM – 9:00 AM', '8:00 AM – 10:00 AM',
        '9:00 AM – 11:00 AM', '10:00 AM – 12:00 PM', '11:00 AM – 1:00 PM',
        '12:00 PM – 2:00 PM', '1:00 PM – 3:00 PM', '2:00 PM – 4:00 PM',
        '3:00 PM – 5:00 PM', '4:00 PM – 6:00 PM', '5:00 PM – 7:00 PM'
    ]
    
    return {
        "status": "success",
        "usedRealModel": used_real_model,
        "prediction_score": float(model_score if model_score is not None else np.mean(hourly_predictions)),
        "stationProfile": profile_name,
        "bestTime": hour_labels[min_idx] if min_idx < len(hour_labels) else '1:00 PM – 3:00 PM',
        "bestTimeQueueCount": hourly_predictions[min_idx],
        "peakBusyTime": hour_labels[max_idx] if max_idx < len(hour_labels) else '5:00 PM – 7:00 PM',
        "peakBusyQueueCount": hourly_predictions[max_idx],
        "hourlyPredictions": hourly_predictions
    }

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            raw_arg = sys.argv[1]
            try:
                input_args = json.loads(raw_arg)
            except Exception:
                input_args = [12.0, 3.0, 1.0, 15.0]
        else:
            input_args = [12.0, 3.0, 1.0, 15.0]
        
        result = run_prediction(input_args)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
