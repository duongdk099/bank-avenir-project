import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

// Infrastructure Modules
import { PrismaModule } from './infrastructure/database/prisma/prisma.module.js';
import { AuthModule } from './infrastructure/auth/auth.module.js';
import { EventStoreModule } from './infrastructure/event-store/event-store.module.js';

// Domain Modules
import { UserModule } from './application/user.module.js';
import { AccountModule } from './application/account.module.js';
import { InvestmentModule } from './application/investment.module.js';
import { LoanModule } from './application/loan.module.js';
import { ChatModule } from './application/chat.module.js';
import { NotificationModule } from './application/notification.module.js';

// Controllers
import { AdminController } from './interface/http/controllers/admin.controller.js';

@Module({
  imports: [
    // Schedule for cron jobs (interest calculation)
    ScheduleModule.forRoot(),
    
    // Infrastructure
    PrismaModule,
    AuthModule,
    EventStoreModule,
    
    // Domain Modules
    UserModule,
    AccountModule,
    InvestmentModule,
    LoanModule,
    ChatModule,
    NotificationModule,
  ],
  controllers: [AppController, AdminController],
  providers: [AppService],
})
export class AppModule {}
