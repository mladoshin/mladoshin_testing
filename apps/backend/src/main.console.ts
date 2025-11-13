import { CommandFactory } from 'nest-commander';
import { ConsoleModule } from './console/console.module';

async function bootstrap() {
  try {
    await CommandFactory.run(ConsoleModule, {
        //logger: console,
        errorHandler: (error) => {
            console.error('Error in command execution:', error);
            process.exit(1); // Exit with failure code
        },
    });
  } catch (e) {
    console.error('Error during bootstrap:', e);
  }
}

bootstrap();
