import redis
import json
import uuid
from datetime import datetime
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import NoteSerializer

# Connect to Redis using the service name from docker-compose
r = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

class NotesCRUDView(APIView):
    def get_user_key(self, user_id):
        return f"user:{user_id}:notes"

    def get(self, request, id=None):
        user_key = self.get_user_key(request.user.id)
        
        if id:
            note_data = r.hget(user_key, id)
            if not note_data:
                return Response({"detail": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response(json.loads(note_data))

        # Fetch all notes from the Hash
        all_notes_raw = r.hgetall(user_key)
        all_notes = [json.loads(v) for v in all_notes_raw.values()]
        
        # Sort by date (since Redis Hashes aren't ordered)
        all_notes.sort(key=lambda x: x['created_at'], reverse=True)
        return Response(all_notes)

    def post(self, request):
        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            note_id = str(uuid.uuid4())
            note_data = {
                "id": note_id,
                **serializer.validated_data,
                "created_at": datetime.now().isoformat()
            }
            
            user_key = self.get_user_key(request.user.id)
            r.hset(user_key, note_id, json.dumps(note_data))
            
            return Response(note_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, id=None):
        user_key = self.get_user_key(request.user.id)
        note_data_raw = r.hget(user_key, id)
        
        if not note_data_raw:
            return Response({"detail": "Note not found"}, status=status.HTTP_404_NOT_FOUND)

        existing_note = json.loads(note_data_raw)
        serializer = NoteSerializer(data=request.data, partial=True)
        
        if serializer.is_valid():
            updated_note = {**existing_note, **serializer.validated_data}
            r.hset(user_key, id, json.dumps(updated_note))
            return Response(updated_note)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id=None):
        user_key = self.get_user_key(request.user.id)
        deleted = r.hdel(user_key, id)
        
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Note not found"}, status=status.HTTP_404_NOT_FOUND)