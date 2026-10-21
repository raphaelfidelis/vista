import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AUTH_SERVICE } from '../Domain/Services/Auth.service';
import type { AuthService } from '../Domain/Services/Auth.service';

/**
 * Redefine a senha de uma conta (não há "esqueci a senha" por e-mail):
 * npm run user:reset-password -- <email>
 * Gera uma senha temporária, mostra-a aqui e encerra as sessões da conta.
 */
async function resetPassword(): Promise<void> {
  const email = process.argv[2];

  if (!email) {
    console.error('Uso: npm run user:reset-password -- <email>');
    process.exitCode = 1;

    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const auth = app.get<AuthService>(AUTH_SERVICE, { strict: false });
    const temporary = await auth.resetPassword(email);

    console.log(`Senha temporária de ${email}: ${temporary}`);
    console.log('Entre com ela e troque em Minha conta.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void resetPassword();
