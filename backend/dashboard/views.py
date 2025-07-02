from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view




@api_view(http_method_names=['GET', 'POST'])
def notifications(request:Request):
    response={"message": "This is a notification message."}
    return Response(data=response, status=status.HTTP_200_OK)