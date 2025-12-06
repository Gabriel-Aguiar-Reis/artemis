import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import {
  WorkOrderResultInsertDTO,
  WorkOrderResultUpdateDTO,
} from '@/src/domain/validations/work-order-result.schema'
import { UUID } from '@/src/lib/utils'

export abstract class WorkOrderResultRepository {
  abstract getWorkOrderResult(id: UUID): Promise<WorkOrderResult>
  abstract getWorkOrderResultByWorkOrderId(
    workOrderId: UUID
  ): Promise<WorkOrderResult>
  abstract addWorkOrderResult(result: WorkOrderResultInsertDTO): Promise<void>
  abstract updateWorkOrderResult(
    result: WorkOrderResultUpdateDTO
  ): Promise<void>
  abstract deleteWorkOrderResult(resultId: UUID): Promise<void>
}
