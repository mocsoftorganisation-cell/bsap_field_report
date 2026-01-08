export interface Range {
  id: number;
  stateId: number;
  rangeName: string;
  rangeHead: string;
  rangeContactNo: string;
  rangeMobileNo: string;
  rangeEmail: string;
  rangeDescription?: string;
  rangeImage: string;
  rangePersonImage: string;
  createdBy: number;
  updatedBy: number;
  active: boolean;
  createdDate: string;
  updatedDate: string;
}