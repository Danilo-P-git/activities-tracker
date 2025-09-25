<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\StaffController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// CRUD API routes
Route::get('/groups/closed', [GroupController::class, 'closed']);

Route::get('events/featured', [EventController::class, 'featured']);

// API: staff di un evento (attivi e non)
Route::get('/events/{event}/staff', [StaffController::class, 'staffByEvent']);

Route::apiResource('events', EventController::class);
Route::apiResource('groups', GroupController::class);
Route::apiResource('staff', StaffController::class);


