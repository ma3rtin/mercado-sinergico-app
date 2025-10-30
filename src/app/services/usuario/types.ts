export interface LoginResponse {
  token: string
}

export interface FirebaseLoginResponse {
  token: string,
  usuario: {
    id: string,
    email: string,
    nombre: string,
    rol: {
      nombre : string
    }
  }
}
