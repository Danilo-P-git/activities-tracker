

<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Se autenticato, redirect automatico a /home, altrimenti welcome
Route::get('/', function () {
    if (auth()->check()) {
        return redirect('/home');
    }
    return redirect('/login');
})->name('Welcome');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/eventi', function () {
        return Inertia::render('events');
    })->name('events');
    Route::get('/home', function () {
        return Inertia::render('home');
    })->name('home');
    Route::get('/gruppi', function () {
        return Inertia::render('groups');
    })->name('groups');
    // Pagina configurazione
    Route::get('/configurazione', function() {
        return Inertia::render('configurazione');
    })->name('configurazione');
});

Route::get('public-page', function() {
    return Inertia::render('public-page');
})->name('public.page');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// ...rimosse rotte API, ora in routes/api.php...
