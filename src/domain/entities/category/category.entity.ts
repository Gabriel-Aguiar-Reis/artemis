import { UUID } from 'crypto'

export type CategorySerializableDTO = {
  id: UUID
  name: string
  isActive: boolean
}
export class Category {
  constructor(
    public id: UUID,
    public name: string,
    public isActive: boolean
  ) {
    if (this.isActive === undefined) {
      this.isActive = true
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Category name cannot be empty.')
    }

    if (name.match(/^[^a-zA-Z0-9\s]*$/)) {
      throw new Error('Category name contains invalid characters.')
    }
  }

  toDTO(): CategorySerializableDTO {
    return {
      id: this.id,
      name: this.name,
      isActive: this.isActive,
    }
  }

  static fromDTO(dto: CategorySerializableDTO): Category {
    return new Category(dto.id, dto.name, dto.isActive)
  }
}
