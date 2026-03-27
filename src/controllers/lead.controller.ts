import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma';

const createLeadSchema = z.object({
  buyer_name: z.string().min(1, 'Buyer name is required'),
  email: z.email('Invalid email address format'),
  phone: z.string().min(10, 'Valid phone number is required'),
  property_id: z.uuid('Invalid property ID format'),
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