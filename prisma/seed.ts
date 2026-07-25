import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const DEMO_PASSWORD = 'Password123!';

async function main() {
  console.info('Seeding LeadFlow database…');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const admin = await db.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Ada Admin', email: 'admin@example.com', passwordHash, role: 'ADMIN' },
  });

  const member = await db.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: { name: 'Max Member', email: 'member@example.com', passwordHash, role: 'MEMBER' },
  });

  const priya = await db.user.upsert({
    where: { email: 'priya@example.com' },
    update: {},
    create: { name: 'Priya Shah', email: 'priya@example.com', passwordHash, role: 'MEMBER' },
  });

  const demoLeads = [
    { name: 'Jordan Lee', email: 'jordan@acme.com', company: 'Acme Inc.', phone: '+1 415 555 0132', source: 'WEBSITE', status: 'NEW', message: 'Interested in the team plan.' },
    { name: 'Sasha Kim', email: 'sasha@brightside.io', company: 'Brightside', phone: '+1 212 555 0187', source: 'REFERRAL', status: 'CONTACTED', message: 'Referred by an existing customer.' },
    { name: 'Diego Morales', email: 'diego@northwind.co', company: 'Northwind Co', phone: '+1 312 555 0110', source: 'COLD_OUTREACH', status: 'QUALIFIED', message: 'Evaluating vendors this quarter.' },
    { name: 'Amara Obi', email: 'amara@fintra.com', company: 'Fintra', phone: '+1 646 555 0199', source: 'EVENT', status: 'PROPOSAL_SENT', message: 'Met at SaaStr, wants a proposal by Friday.' },
    { name: 'Liu Wei', email: 'liu@greenfield.dev', company: 'Greenfield', phone: '+1 917 555 0144', source: 'SOCIAL_MEDIA', status: 'WON', message: 'Signed the annual contract.' },
    { name: 'Noor Haddad', email: 'noor@vertex.ai', company: 'Vertex AI', phone: '+1 650 555 0176', source: 'WEBSITE', status: 'LOST', message: 'Went with a competitor.' },
    { name: 'Emily Chen', email: 'emily@parklane.com', company: 'Parklane Retail', phone: '+1 305 555 0122', source: 'REFERRAL', status: 'NEW', message: 'Looking for a CRM alternative.' },
    { name: 'Tomás Rivera', email: 'tomas@buildwright.com', company: 'Buildwright', phone: '+1 720 555 0166', source: 'OTHER', status: 'CONTACTED', message: '' },
  ] as const;

  for (const [index, data] of demoLeads.entries()) {
    const lead = await db.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        message: data.message || null,
        source: data.source,
        status: data.status,
        createdBy: { connect: { id: admin.id } },
      },
    });

    await db.leadActivity.create({
      data: { leadId: lead.id, userId: admin.id, action: 'LEAD_CREATED', message: 'Lead created (seed data)' },
    });

    // Assign every other lead to alternate between Max and Priya
    const assignee = index % 2 === 0 ? member : priya;
    await db.leadAssignment.create({
      data: { leadId: lead.id, assignedToId: assignee.id, assignedById: admin.id, active: true },
    });
    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: admin.id,
        action: 'ASSIGNMENT_CHANGED',
        message: `Assigned to ${assignee.name}`,
        meta: { assignedToId: assignee.id },
      },
    });

    if (data.status !== 'NEW') {
      await db.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: assignee.id,
          action: 'STATUS_CHANGED',
          message: `Status changed from NEW to ${data.status}`,
          meta: { from: 'NEW', to: data.status },
        },
      });

      await db.leadNote.create({
        data: {
          leadId: lead.id,
          authorId: assignee.id,
          text: `Followed up with ${data.name} — moved to ${data.status.toLowerCase().replace('_', ' ')}.`,
        },
      });
    }
  }

  console.info('Seed complete.');
  console.info('Demo credentials:');
  console.info('  Admin:  admin@example.com  / Password123!');
  console.info('  Member: member@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
