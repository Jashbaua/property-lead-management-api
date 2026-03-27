import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { PropertyStatus } from '../generated/prisma/client';

export const getProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '10', city, status, bedrooms } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (city) where.city = city as string;
    if (status) where.status = status as PropertyStatus;
    if (bedrooms) where.bedrooms = parseInt(bedrooms as string, 10);

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' }, 
      }),
      prisma.property.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }

    const leadGroups = await prisma.lead.groupBy({
      by: ['status'],
      where: { property_id: id },
      _count: { _all: true }, 
    });

    const leadsCountByStatus = leadGroups.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      data: {
        ...property,
        lead_counts: leadsCountByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};