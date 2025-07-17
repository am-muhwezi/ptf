from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, action
from .models import Member
from .serializers import MemberSerializer
from django.shortcuts import get_object_or_404


@api_view(http_method_names=["GET", "POST"])
def homepage(request: Request):
    """
    Home view for the members app.
    """
    if request.method == "POST":
        data = request.data
        response = {"message": "Data received successfully", "data": data}
        return Response(data=response, status=status.HTTP_201_CREATED)
    response = {"message": "Get Welcome to the Members App!"}
    return Response(data=response, status=status.HTTP_200_OK)


class MemberViewset(viewsets.ModelViewSet):
    """
    View to list and create members.
    """

    queryset = Member.objects.all()
    serializer_class = MemberSerializer

    @action(detail=True, methods=["post"])
    def checkin(self, request: Request, pk: int):
        """
        Check-in a member by ID.
        """
        member = get_object_or_404(Member, pk=pk)
        member.checked_in = True
        member.save()
        return Response(
            {
                "message": f"{member.first_name} {member.last_name} checked in successfully."
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def checkout(self, request: Request, pk: int):
        """
        Check-out a member by ID.
        """
        member = get_object_or_404(Member, pk=pk)
        member.checked_in = False
        member.save()
        return Response(
            {
                "message": f"{member.first_name} {member.last_name} checked out successfully."
            },
            status=status.HTTP_200_OK,
        )
