import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateLeadDto } from './leads.dto';

const errors = (body: unknown) => validateSync(plainToInstance(CreateLeadDto, body)).map((e) => e.property);

describe('CreateLeadDto', () => {
  it('принимает заявку с контактами и текстом', () => {
    expect(errors({ source: 'manual', contactName: 'Анна', contactPhone: '+7 (900) 000-00-00', message: 'Ищу двушку' })).toEqual([]);
  });

  it('отклоняет телефон с буквами', () => {
    expect(errors({ source: 'manual', contactPhone: 'позвоните мне' })).toEqual(['contactPhone']);
  });

  it('текст из одних пробелов считается слишком коротким', () => {
    expect(errors({ source: 'manual', message: '     ' })).toEqual(['message']);
  });

  it('отклоняет текст длиннее 2000 символов', () => {
    expect(errors({ source: 'manual', message: 'а'.repeat(2001) })).toEqual(['message']);
  });
});
