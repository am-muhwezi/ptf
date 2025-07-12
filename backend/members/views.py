from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status, generics, mixins
from rest_framework.decorators import api_view, APIView
from .models import Member
from .serializers import MemberSerializer
from django.shortcuts import get_object_or_404
from django.db.models import Q


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


class MemberListCreateView(
    generics.GenericAPIView, mixins.ListModelMixin, mixins.CreateModelMixin
):
    serializer_class = MemberSerializer

    def get_queryset(self):
        query = self.request.GET.get("q", "").strip()
        if query:
            return Member.objects.filter(
                Q(id__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(email__icontains=query)
            )
        return Member.objects.all()

    def list(self, request, *args, **kwargs):
        """
        Override the list method to return just the serialized data without pagination wrapper
        """
        queryset = self.get_queryset()

        # Handle empty search results
        if request.GET.get("q") and not queryset.exists():
            return Response(
                {"detail": "Member detail Not Found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Serialize the queryset directly
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get(self, request: Request, *args, **kwargs) -> Response:
        """
        Handle GET requests to list all members.
        """
        return self.list(request, *args, **kwargs)

    def post(self, request: Request, *args, **kwargs) -> Response:
        """
        Handle POST requests to create a new member.
        """
        return self.create(request, *args, **kwargs)


class MemberRetrieveUpdateDelete(
    generics.GenericAPIView,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
):
    """
    View to handle GET, PUT, and DELETE requests for a specific member.
    """

    serializer_class = MemberSerializer
    queryset = Member.objects.all()

    def get(self, request: Request, *args, **kwargs) -> Response:
        """
        Handle GET requests to retrieve a specific member by ID.
        """
        return self.retrieve(request, *args, **kwargs)

    def put(self, request: Request, *args, **kwargs) -> Response:
        """
        Handle PUT requests to update a specific member by ID.
        """
        return self.update(request, *args, **kwargs)

    def delete(self, request: Request, *args, **kwargs) -> Response:
        """
        Handle DELETE requests to delete a specific member by ID.
        """
        return self.destroy(request, *args, **kwargs)


class MemberCheckInView(APIView):
    """
    Handle Member checkin
    """

    def post(self, request: Request, pk: int) -> Response:
        """
        Check in a member by ID.
        """
        member = get_object_or_404(Member, pk=pk)
        if member.check_in():
            return Response(
                {
                    "message": f"{member.first_name} {member.last_name} has been checked in.",
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"message": "Member is already checked in."},
            status=status.HTTP_400_BAD_REQUEST,
        )
