import { CommandFactory } from 'nest-commander';
import { ConsoleModule } from './console/console.module';

async function bootstrap() {
    await CommandFactory.run(ConsoleModule);
}

bootstrap();
