import {
  Category,
  CategorySerializableDTO,
} from '@/src/domain/entities/category/category.entity'
import { describe, expect, it } from 'vitest'

describe('Category Entity', () => {
  const validDTO: CategorySerializableDTO = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Eletrônicos',
    isActive: true,
  }

  describe('constructor', () => {
    it('should create category with valid data', () => {
      const category = new Category(
        validDTO.id,
        validDTO.name,
        validDTO.isActive
      )

      expect(category.id).toBe(validDTO.id)
      expect(category.name).toBe(validDTO.name)
      expect(category.isActive).toBe(true)
    })

    it('should set isActive to true by default if undefined', () => {
      const category = new Category(
        validDTO.id,
        validDTO.name,
        undefined as any
      )

      expect(category.isActive).toBe(true)
    })

    it('should throw an error when name is empty', () => {
      expect(() => {
        new Category(validDTO.id, '', true)
      }).toThrow('O nome da categoria é obrigatório.')
    })

    it('should throw an error when name contains only spaces', () => {
      expect(() => {
        new Category(validDTO.id, '   ', true)
      }).toThrow('O nome da categoria é obrigatório.')
    })

    it('should throw an error when name contains only special characters', () => {
      expect(() => {
        new Category(validDTO.id, '!@#$%', true)
      }).toThrow('O nome da categoria contém caracteres inválidos.')
    })

    it('should accept name with alphanumeric characters', () => {
      const category = new Category(validDTO.id, 'Categoria123', true)
      expect(category.name).toBe('Categoria123')
    })

    it('should accept name with spaces', () => {
      const category = new Category(
        validDTO.id,
        'Eletrônicos e Informática',
        true
      )
      expect(category.name).toBe('Eletrônicos e Informática')
    })

    it('should accept isActive as false', () => {
      const category = new Category(validDTO.id, 'Test', false)
      expect(category.isActive).toBe(false)
    })
  })

  describe('toDTO', () => {
    it('should serialize category to DTO', () => {
      const category = new Category(
        validDTO.id,
        validDTO.name,
        validDTO.isActive
      )

      const dto = category.toDTO()

      expect(dto).toEqual(validDTO)
      expect(dto).toHaveProperty('id')
      expect(dto).toHaveProperty('name')
      expect(dto).toHaveProperty('isActive')
    })

    it('should maintain original values after serialization', () => {
      const category = new Category(validDTO.id, 'Móveis', false)
      const dto = category.toDTO()

      expect(dto.id).toBe(validDTO.id)
      expect(dto.name).toBe('Móveis')
      expect(dto.isActive).toBe(false)
    })
  })

  describe('fromDTO', () => {
    it('should create category from valid DTO', () => {
      const category = Category.fromDTO(validDTO)

      expect(category).toBeInstanceOf(Category)
      expect(category.id).toBe(validDTO.id)
      expect(category.name).toBe(validDTO.name)
      expect(category.isActive).toBe(validDTO.isActive)
    })

    it('should validate name when creating from DTO', () => {
      const invalidDTO = { ...validDTO, name: '' }

      expect(() => {
        Category.fromDTO(invalidDTO)
      }).toThrow('O nome da categoria é obrigatório.')
    })

    it('should preserve all properties from the DTO', () => {
      const dto: CategorySerializableDTO = {
        id: '123e4567-e89b-12d3-a456-426614174001' as any,
        name: 'Nova Categoria',
        isActive: false,
      }

      const category = Category.fromDTO(dto)

      expect(category.id).toBe(dto.id)
      expect(category.name).toBe(dto.name)
      expect(category.isActive).toBe(dto.isActive)
    })
  })

  describe('round trip serialization', () => {
    it('should maintain data after serializing and deserializing', () => {
      const original = new Category(
        validDTO.id,
        validDTO.name,
        validDTO.isActive
      )
      const dto = original.toDTO()
      const restored = Category.fromDTO(dto)

      expect(restored.id).toBe(original.id)
      expect(restored.name).toBe(original.name)
      expect(restored.isActive).toBe(original.isActive)
    })
  })
})
