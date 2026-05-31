import pytest
from applications.models import Application

@pytest.mark.django_db
class TestStatusTransition:

    def test_valid_transition(self, application):
        application.transition_to('UNDER_REVIEW')
        assert application.status == 'UNDER_REVIEW'

    def test_invalid_transition_raises_error(self, application):
        with pytest.raises(ValueError):
            application.transition_to('SHORTLISTED') 

    def test_cannot_go_backward(self, application):
        application.transition_to('UNDER_REVIEW')
        with pytest.raises(ValueError):
            application.transition_to('SUBMITTED')