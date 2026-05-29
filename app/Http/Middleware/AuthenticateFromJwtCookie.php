<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateFromJwtCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('jwt_token');

        if ($token && ! $request->bearerToken()) {
            $request->headers->set('Authorization', 'Bearer '.$token);
        }

        if ($token) {
            try {
                $user = JWTAuth::setToken($token)->authenticate();

                if ($user) {
                    auth()->guard('web')->setUser($user);
                    auth()->shouldUse('web');
                    $request->setUserResolver(static fn () => $user);
                }
            } catch (JWTException) {
                // Invalid or expired tokens should fall through as unauthenticated.
            }
        }

        return $next($request);
    }
}
