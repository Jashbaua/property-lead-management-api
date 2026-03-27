import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { LeadPriority, LeadStatus } from '../generated/prisma/client';

const createLeadSchema = z.object({
  buyer_name: z.string().min(1, 'Buyer name is required'),
  email: z.email('Invalid email address format'),
  phone: z.string().min(10, 'Valid phone number is required'),
  property_id: z.uuid('Invalid property ID format'),
});

const updateLeadSchema = z.object({
  priority: z.enum(['Hot', 'Warm', 'Cold']).optional(),
  notes: z.string().optional(),
});

const transitionLeadSchema = z.object({
  status: z.enum(['New', 'Contacted', 'Visited', 'Booked', 'Lost'], {
    message: "Status must be 'New', 'Contacted', 'Visited', 'Booked', or 'Lost'",
  }),
});

export const createLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = createLeadSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`),
      });
      return;
    }

    const { buyer_name, email, phone, property_id } = validationResult.data;

    const property = await prisma.property.findUnique({
      where: { id: property_id },
    });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }

    if (property.status !== 'Available') {
      res.status(400).json({ success: false, message: 'Cannot create a lead for a Booked property' });
      return;
    }

    const existingLead = await prisma.lead.findUnique({
      where: {
        phone_property_id: {
          phone,
          property_id,
        },
      },
    });

    if (existingLead) {
      res.status(400).json({ success: false, message: 'A lead with this phone number already exists for this property' });
      return;
    }

    const newLead = await prisma.lead.create({
      data: {
        buyer_name,
        email,
        phone,
        property_id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: newLead,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '10', status, priority, property_id } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status as LeadStatus;
    if (priority) where.priority = priority as LeadPriority;
    if (property_id) where.property_id = property_id as string;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: leads,
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

export const getLeadById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        property: true, 
      },
    });

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (req.body.status) {
      res.status(400).json({ 
        success: false, 
        message: 'Cannot update status here. Please use the /transition endpoint.' 
      });
      return;
    }

    const validationResult = updateLeadSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`),
      });
      return;
    }

    const { priority, notes } = validationResult.data;

    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...(priority && { priority }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: updatedLead,
    });
  } catch (error) {
    next(error);
  }
};

export const transitionLeadStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const validationResult = transitionLeadSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`),
      });
      return;
    }

    const requestedStatus = validationResult.data.status;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    const currentStatus = lead.status;

    const allowedTransitions: Record<LeadStatus, LeadStatus[]> = {
      New: ['Contacted', 'Lost'],
      Contacted: ['Visited', 'Lost'],
      Visited: ['Booked', 'Lost'],
      Booked: [], 
      Lost: [],   
    };

    if (currentStatus === 'Booked' || currentStatus === 'Lost') {
      res.status(400).json({ 
        success: false, 
        message: `Cannot transition from '${currentStatus}'. This is a terminal state.` 
      });
      return;
    }

    if (!allowedTransitions[currentStatus].includes(requestedStatus as LeadStatus)) {
      const nextValid = allowedTransitions[currentStatus].filter(s => s !== 'Lost').join(' or ');
      res.status(400).json({ 
        success: false, 
        message: `Cannot move from '${currentStatus}' to '${requestedStatus}'. Next valid status is '${nextValid}'.` 
      });
      return;
    }

    let updatedLead;

    if (requestedStatus === 'Booked') {
      const result = await prisma.$transaction([
        prisma.lead.update({
          where: { id },
          data: { status: requestedStatus as LeadStatus },
        }),
        prisma.property.update({
          where: { id: lead.property_id },
          data: { status: 'Booked' }, 
        }),
      ]);
      
      updatedLead = result[0]; 
    } else {
      updatedLead = await prisma.lead.update({
        where: { id },
        data: { status: requestedStatus as LeadStatus },
      });
    }

    res.status(200).json({
      success: true,
      message: `Lead successfully transitioned to '${requestedStatus}'`,
      data: updatedLead,
    });
  } catch (error) {
    next(error);
  }
};