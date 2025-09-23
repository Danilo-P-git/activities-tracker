<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;

use App\Models\Event;

/**
 * @OA\Tag(
 *     name="Events",
 *     description="API per la gestione degli eventi"
 * )
 */
class EventController extends Controller{
    /**
     * @OA\Get(
     *     path="/api/events",
     *     tags={"Events"},
     *     summary="Lista di tutti gli eventi",
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function index()
    {
        try {
            return response()->json(Event::all());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/events",
     *     tags={"Events"},
     *     summary="Crea un nuovo evento",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Event")
     *     ),
     *     @OA\Response(response=201, description="Creato")
     * )
     */
    public function store(StoreEventRequest $request)
    {
        try {
            $event = Event::create($request->validated());
            return response()->json($event, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/events/{id}",
     *     tags={"Events"},
     *     summary="Mostra un evento",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function show(Event $event)
    {
        try {
            return response()->json($event);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/events/{id}",
     *     tags={"Events"},
     *     summary="Aggiorna un evento",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Event")
     *     ),
     *     @OA\Response(response=200, description="Aggiornato")
     * )
     */
    public function update(UpdateEventRequest $request, Event $event)
    {
        try {
            $event->update($request->validated());
            return response()->json($event);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/events/{id}",
     *     tags={"Events"},
     *     summary="Elimina un evento",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=204, description="Eliminato")
     * )
     */
    public function destroy(Event $event)
    {
        try {
            $event->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
