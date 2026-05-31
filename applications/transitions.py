from rest_framework import serializers


VALID_TRANSITIONS = {
    'SUBMITTED':    ['UNDER_REVIEW'],
    'UNDER_REVIEW': ['SHORTLISTED', 'REJECTED'],
    'SHORTLISTED':  ['REJECTED'],
    'REJECTED':     [],
}


def validate_status_transition(current_status, new_status):
    """
    Raises ValidationError if moving from current_status to new_status
    is not an allowed transition.
    """
    if current_status == new_status:
        raise serializers.ValidationError(
            f"Application is already in '{current_status}' status."
        )

    allowed = VALID_TRANSITIONS.get(current_status, [])

    if new_status not in allowed:
        allowed_display = allowed if allowed else ["none — this is a terminal status"]
        raise serializers.ValidationError(
            f"Cannot transition from '{current_status}' to '{new_status}'. "
            f"Allowed transitions: {allowed_display}"
        )