import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Infrastructure Modules
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { EventStoreModule } from './infrastructure/event-store/event-store.module';
import { RepositoryModule } from './infrastructure/repositories/repository.module';

// Domain Modules
import { UserModule } from './application/user.module';
import { AccountModule } from './application/account.module';
import { InvestmentModule } from './application/investment.module';
import { LoanModule } from './application/loan.module';
import { ChatModule } from './application/chat.module';
import { NotificationModule } from './application/notification.module';
import { AdminModule } from './application/admin.module';

// Controllers
import { NewsController } from './interface/http/controllers/news.controller';

@Module({
  imports: [
    // Schedule for cron jobs (interest calculation)
    ScheduleModule.forRoot(),

    // Infrastructure
    PrismaModule,
    AuthModule,
    EventStoreModule,
    RepositoryModule,

    // Domain Modules
    UserModule,
    AccountModule,
    InvestmentModule,
    LoanModule,
    ChatModule,
    NotificationModule,
    AdminModule,
  ],
  controllers: [AppController, NewsController],
  providers: [AppService],
})
export class AppModule {}
