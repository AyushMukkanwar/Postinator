import { SetMetadata } from '@nestjs/common';

export const ResourceParamName = (paramName: string) =>
  SetMetadata('resourceParamName', paramName);
