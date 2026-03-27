import request from 'supertest';
import app from '../server';
import prisma from '../prisma';

describe('Property Lead API Tests', () => {
  let token: string;
  let testPropertyId: string;
  let testLeadId: string;

  beforeAll(async () => {
    const loginRes = await request(app).post('/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    });
    token = loginRes.body.token;

    const prop = await prisma.property.create({
      data: {
        title: 'Test Property',
        address: '123 Test St',
        city: 'Test City',
        price: 100000,
        bedrooms: 2,
        status: 'Available',
      },
    });
    testPropertyId = prop.id;
  });

  afterAll(async () => {
    await prisma.lead.deleteMany({ where: { property_id: testPropertyId } });
    await prisma.property.delete({ where: { id: testPropertyId } });
    await prisma.$disconnect();
  });


  it('should reject duplicate lead creation (same phone + same property)', async () => {
    const lead1 = await request(app)
      .post('/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        buyer_name: 'Test Buyer',
        email: 'test@buyer.com',
        phone: '9999999999',
        property_id: testPropertyId,
      });

    expect(lead1.status).toBe(201);
    testLeadId = lead1.body.data.id; 

    const lead2 = await request(app)
      .post('/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        buyer_name: 'Test Buyer 2',
        email: 'test2@buyer.com',
        phone: '9999999999', 
        property_id: testPropertyId, 
      });

    
    expect(lead2.status).toBe(400);
    expect(lead2.body.message).toContain('already exists');
  });

  it('should succeed on valid lead status transition (New -> Contacted)', async () => {
    const res = await request(app)
      .post(`/leads/${testLeadId}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Contacted' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Contacted');
  });

  it('should return error on invalid lead status transition (Contacted -> Booked)', async () => {
    const res = await request(app)
      .post(`/leads/${testLeadId}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Booked' }); 

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Next valid status is 'Visited'");
  });

});