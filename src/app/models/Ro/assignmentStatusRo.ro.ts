import type { AssignmentStatus } from '../../common/enums';

export interface AssignmentStatusRo {
  assignmentId: string;
  status: AssignmentStatus;
  message: string;
  resultUrl: string | null;
}
