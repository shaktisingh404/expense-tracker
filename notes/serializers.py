from rest_framework import serializers

class NoteSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=100)
    content = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)

    def validate_title(self, value):
        if "secret" in value.lower():
            raise serializers.ValidationError("Title cannot contain 'secret'")
        return value