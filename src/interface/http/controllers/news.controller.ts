import { Controller, Post, Get, Body, UseGuards, Request, Param, Put, Delete } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../infrastructure/auth/guards/roles.guard.js';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * News Controller
 *
 * Per assignment (Sujet 2):
 * - Conseiller can create news visible to all clients
 * - Clients can see news feed in real-time via SSE
 */
@Controller('news')
export class NewsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create news (MANAGER only)
   * Per assignment: "En tant que conseiller, je dois pouvoir créer une nouvelle actualités consultable par les clients"
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async createNews(
    @Request() req,
    @Body()
    dto: {
      title: string;
      content: string;
      category?: string;
    },
  ) {
    const news = await this.prisma.news.create({
      data: {
        id: uuidv4(),
        authorId: req.user.sub,
        title: dto.title,
        content: dto.content,
        category: dto.category || 'GENERAL',
      },
    });

    return {
      message: 'News created successfully',
      news,
    };
  }

  /**
   * Get all news (for clients - feed)
   */
  @Get()
  async getAllNews() {
    const news = await this.prisma.news.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return news;
  }

  /**
   * Get a single news item
   */
  @Get(':id')
  async getNews(@Param('id') id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
    });

    return news;
  }

  /**
   * Update news (MANAGER only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async updateNews(
    @Param('id') id: string,
    @Body()
    dto: {
      title?: string;
      content?: string;
      category?: string;
      isPublished?: boolean;
    },
  ) {
    const news = await this.prisma.news.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'News updated successfully',
      news,
    };
  }

  /**
   * Delete news (MANAGER/ADMIN only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async deleteNews(@Param('id') id: string) {
    await this.prisma.news.delete({
      where: { id },
    });

    return {
      message: 'News deleted successfully',
    };
  }
}
