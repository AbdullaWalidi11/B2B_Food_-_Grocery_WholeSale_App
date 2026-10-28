import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserRole } from "generated/prisma/client";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    vendorId?: string | null;
    companyId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'b2b_wholesale_super_secret_jwt_key_2026_turkey',
        });
    }

    async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            vendorId: payload.vendorId ?? null,
            companyId: payload.companyId ?? null,
        }
    }
}
