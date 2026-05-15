from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer, UserUpdateSerializer
from .models import DESIGNATION_CHOICES


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class   = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user      = serializer.save()
        tokens    = get_tokens_for_user(user)
        user_data = UserSerializer(user).data
        return Response(
            {**tokens, 'user': user_data},
            status=status.HTTP_201_CREATED
        )


class MeView(RetrieveUpdateAPIView):
    """GET /api/auth/me/  →  full profile data
       PATCH /api/auth/me/ →  update email, bio, designation, etc.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        # Run update via parent
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Return full profile data
        user.refresh_from_db()
        return Response(UserSerializer(user).data)


DESIGNATION_GROUPS = [
    ('👑 Leadership & C-Suite', ['ceo','cto','coo','cfo']),
    ('🏢 Management',          ['engineering_manager','project_manager','product_manager',
                                 'delivery_manager','operations_manager','hr_manager','sales_manager']),
    ('💻 Engineering',         ['fullstack_developer','frontend_developer','backend_developer',
                                 'mobile_developer','software_engineer']),
    ('🗄️ Database & Infrastructure', ['db_handler','db_architect','devops_engineer',
                                       'cloud_engineer','network_engineer','security_engineer']),
    ('✅ Quality & Testing',   ['quality_lead','qa_engineer','automation_tester',
                                 'manual_tester','performance_tester']),
    ('🎨 Design & Product',    ['ui_ux_designer','product_designer','graphic_designer']),
    ('📊 Data & Analytics',    ['data_scientist','data_analyst','data_engineer','ml_engineer']),
    ('🤝 Business & Support',  ['business_analyst','scrum_master','technical_lead',
                                 'consultant','support_engineer','intern','student','other']),
]

class DesignationsView(APIView):
    """GET /api/auth/designations/  →  grouped list of designation choices"""
    permission_classes = [AllowAny]

    def get(self, request):
        lookup = dict(DESIGNATION_CHOICES)
        # Return as grouped list: [{group, options:[{value,label}]}]
        groups = []
        for group_label, values in DESIGNATION_GROUPS:
            groups.append({
                'group': group_label,
                'options': [
                    {'value': v, 'label': lookup[v]}
                    for v in values
                    if v in lookup
                ]
            })
        return Response(groups)
