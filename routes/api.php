<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\EventGroupStaffController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// CRUD API routes
Route::apiResource('events', EventController::class);
Route::apiResource('groups', GroupController::class);
Route::apiResource('staff', StaffController::class);

// Pivot management routes
Route::post('event-group-staff', [EventGroupStaffController::class, 'store']);
Route::delete('event-group-staff', [EventGroupStaffController::class, 'destroy']);
Route::post('event-group-staff/assign', [EventGroupStaffController::class, 'assignStaffToGroup']);
