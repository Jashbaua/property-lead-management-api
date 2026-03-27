import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [propertiesByStatus, leadsByStatus, leadsByPriority, totalLeads] = await Promise.all([
      prisma.property.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ['priority'], _count: { _all: true } }),
      prisma.lead.count(), 
    ]);

    const formattedProperties = propertiesByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    let bookedLeadsCount = 0;
    const formattedLeadsByStatus = leadsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      if (curr.status === 'Booked') {
        bookedLeadsCount = curr._count._all;
      }
      return acc;
    }, {} as Record<string, number>);

    const formattedLeadsByPriority = leadsByPriority.reduce((acc, curr) => {
      acc[curr.priority] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    const conversionRate = totalLeads === 0 
      ? 0 
      : parseFloat(((bookedLeadsCount / totalLeads) * 100).toFixed(2)); 

    res.status(200).json({
      success: true,
      data: {
        properties_by_status: formattedProperties,
        leads_by_status: formattedLeadsByStatus,
        leads_by_priority: formattedLeadsByPriority,
        total_leads: totalLeads,
        conversion_rate_percentage: conversionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};