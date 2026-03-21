from pydantic import BaseModel, EmailStr


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    nombre: str
    email: str
    rol: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse
