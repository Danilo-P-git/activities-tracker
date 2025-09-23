<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;

use App\Models\Staff;

/**
 * @OA\Tag(
 *     name="Staff",
 *     description="API per la gestione dello staff"
 * )
 */
class StaffController extends Controller{
    /**
     * @OA\Get(
     *     path="/api/staff",
     *     tags={"Staff"},
     *     summary="Lista di tutto lo staff",
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function index()
    {
        try {
            return response()->json(Staff::all());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/staff",
     *     tags={"Staff"},
     *     summary="Crea un nuovo membro dello staff",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Staff")
     *     ),
     *     @OA\Response(response=201, description="Creato")
     * )
     */
    public function store(StoreStaffRequest $request)
    {
        try {
            $staff = Staff::create($request->validated());
            return response()->json($staff, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/staff/{id}",
     *     tags={"Staff"},
     *     summary="Mostra un membro dello staff",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function show(Staff $staff)
    {
        try {
            return response()->json($staff);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/staff/{id}",
     *     tags={"Staff"},
     *     summary="Aggiorna un membro dello staff",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Staff")
     *     ),
     *     @OA\Response(response=200, description="Aggiornato")
     * )
     */
    public function update(UpdateStaffRequest $request, Staff $staff)
    {
        $staff->update($request->validated());
        return response()->json($staff);
    }

    /**
     * @OA\Delete(
     *     path="/api/staff/{id}",
     *     tags={"Staff"},
     *     summary="Elimina un membro dello staff",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=204, description="Eliminato")
     * )
     */
    public function destroy(Staff $staff)
    {
        $staff->delete();
        return response()->json(null, 204);
    }
}
