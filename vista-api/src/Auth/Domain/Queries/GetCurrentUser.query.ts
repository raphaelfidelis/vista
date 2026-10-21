export const GET_CURRENT_USER_QUERY = Symbol('GetCurrentUserQuery');

/** Só o que a tela precisa: nada de hash, nada de datas internas. */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  hasPassword: boolean;
}

export interface GetCurrentUserQuery {
  execute(userId: string): Promise<UserDto>;
}
