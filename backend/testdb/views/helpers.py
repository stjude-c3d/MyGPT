"""
General utility helper functions
"""
import re


def sanitize_filename(filename):
    """Allow only alphanumeric characters, underscores, hyphens, and dots"""
    return re.sub(r'[^a-zA-Z0-9_\-\.\\\/]', '_', filename)


def seconds_to_hhmmss(seconds):
    """Convert seconds to HH:MM:SS format"""
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    return "%d:%02d:%02d" % (h, m, s)


def min_max_normalization(data, best_val, worst_val, reverse=False):
    """
    Normalize the data using min-max normalization.
    This function assumes the bigger the value the better.
    If reverse is true, then the smaller the value the better.
    """
    normalized_data = []
    for value in data:
        if reverse:
            normalized_value = (worst_val - value) / (worst_val - best_val)
        else:
            normalized_value = (value - worst_val) / (best_val - worst_val)
        normalized_data.append(normalized_value)
    return normalized_data


def find_cutoff_distance(distances):
    """Find the distance from where the distances start to increase"""
    cutoff_distance = distances[1]
    distances_diff = []
    for i in range(len(distances)-1):
        distances_diff.append(distances[i+1] - distances[i])
    print('distances_diff: ', distances_diff)
    for i in range(1, len(distances_diff)-1):
        if distances_diff[i+1] > distances_diff[i]:
            cutoff_distance = distances[i+2]
        else:
            cutoff_distance = distances[i+1]
            break
    return cutoff_distance
