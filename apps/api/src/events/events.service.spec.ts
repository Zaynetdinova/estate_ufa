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
