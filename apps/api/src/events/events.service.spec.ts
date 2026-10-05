import { EventsService } from './events.service';

describe('EventsService.countViewedProperties', () => {
  it('считает разные ЖК, а не события просмотра', async () => {
    const findMany = jest.fn().mockResolvedValue([{ propertyId: 1 }, { propertyId: 2 }]);
    const service = new EventsService({ userEvent: { findMany } } as any, {} as any);

    await expect(service.countViewedProperties(7)).resolves.toBe(2);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 7, eventType: 'VIEW_PROPERTY', propertyId: { not: null } }),
        distinct: ['propertyId'],
      }),
    );
  });
});

describe('EventsService.track', () => {
  function createService() {
    const prisma = {
      userEvent: { create: jest.fn().mockResolvedValue({ id: 1 }) },
      property: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const n8n = { sendEvent: jest.fn().mockResolvedValue(undefined) };
    return { service: new EventsService(prisma as any, n8n as any), prisma };
  }

  it('VIEW_PROPERTY увеличивает счётчик просмотров ЖК', async () => {
    const { service, prisma } = createService();
    await service.track({ eventType: 'VIEW_PROPERTY' as any, propertyId: 5, payload: {} });
    expect(prisma.property.updateMany).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { viewsCount: { increment: 1 } },
    });
  });

  it('другие события счётчик не трогают', async () => {
    const { service, prisma } = createService();
    await service.track({ eventType: 'ADD_FAVORITE' as any, propertyId: 5, payload: {} });
    expect(prisma.property.updateMany).not.toHaveBeenCalled();
  });
});
