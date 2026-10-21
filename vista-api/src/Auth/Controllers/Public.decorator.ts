import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Rota que dispensa a sessão: só login e cadastro. Todas as outras exigem. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
