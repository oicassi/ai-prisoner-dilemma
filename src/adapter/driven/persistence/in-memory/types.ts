import { IMessage, IReport } from '@/domain/game/types'

export interface IInMemoryHistory extends Record<string, Record<string, IMessage[]>> {}
export interface IInMemoryPoints extends Record<string, Record<string, number>> {}
export interface IInMemoryMoves extends Record<string, Record<string, string[]>> {}
export interface IInMemoryReport extends IReport {}
