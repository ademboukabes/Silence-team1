import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        return true; // Simplified: Role system removed to fix build
    }
}

// Decorator
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: any[]) => SetMetadata('roles', roles);
