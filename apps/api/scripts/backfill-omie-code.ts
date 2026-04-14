import { prisma } from '../src/db';
import { OmieAdapter } from '../src/integrations/omie/OmieAdapter';

const BATCH_SIZE = 500;

async function main() {
  let cursor: string | undefined;
  let updatedOmieCode = 0;
  let updatedFamily = 0;
  let skipped = 0;
  let errors = 0;

  while (true) {
    const items = (await prisma.omieProduct.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        omieId: true,
        omieCode: true,
        familyDescription: true,
        rawPayload: true,
      },
    } as any)) as Array<{
      id: string;
      omieId: string;
      omieCode: string | null;
      familyDescription: string | null;
      rawPayload: any;
    }>;

    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      cursor = item.id;

      const extractedCode = OmieAdapter.extractProductCode(item.rawPayload)?.trim() || item.omieId?.trim();
      const extractedFamily = OmieAdapter.extractFamilyDescription(item.rawPayload)?.trim() || null;

      const shouldUpdateOmieCode = !item.omieCode && Boolean(extractedCode);
      const shouldUpdateFamily = !item.familyDescription && Boolean(extractedFamily);

      if (!shouldUpdateOmieCode && !shouldUpdateFamily) {
        skipped += 1;
        continue;
      }

      try {
        const data: { omieCode?: string; familyDescription?: string | null } = {};
        if (shouldUpdateOmieCode && extractedCode) data.omieCode = extractedCode;
        if (shouldUpdateFamily) data.familyDescription = extractedFamily;

        const result = await prisma.omieProduct.updateMany({
          where: {
            id: item.id,
            ...(shouldUpdateOmieCode ? { omieCode: null } : {}),
            ...(shouldUpdateFamily ? { familyDescription: null } : {}),
          },
          data,
        } as any);

        if (result.count > 0) {
          if (shouldUpdateOmieCode) updatedOmieCode += 1;
          if (shouldUpdateFamily) updatedFamily += 1;
        } else {
          skipped += 1;
        }
      } catch (e) {
        errors += 1;
      }
    }

    process.stdout.write(
      `processed=${cursor} updatedOmieCode=${updatedOmieCode} updatedFamily=${updatedFamily} skipped=${skipped} errors=${errors}\n`
    );
  }

  process.stdout.write(
    `done updatedOmieCode=${updatedOmieCode} updatedFamily=${updatedFamily} skipped=${skipped} errors=${errors}\n`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
