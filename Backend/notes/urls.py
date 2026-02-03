from django.urls import path
from .views import NotesCRUDView

urlpatterns = [
    # Handle GET (single), PUT, and DELETE
    path("<uuid:id>/", NotesCRUDView.as_view(), name="note-detail"),
    
    # Handle GET (list) and POST (create)
    path("", NotesCRUDView.as_view(), name="note-list-create"),
]