<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Configurazione;

class ConfigurazioneController extends Controller
{
    // Restituisce tutte le configurazioni come oggetto associativo
    public function show()
    {
        $assoc = Configurazione::getAllAssoc();
        return response()->json($assoc);
    }

    // Aggiorna o crea una configurazione (key-value)
    public function update(Request $request)
    {
        $data = $request->validate([
            'chiave' => 'required|string|max:100',
            'valore' => 'required|string|max:255',
        ]);
        $config = Configurazione::where('chiave', $data['chiave'])->first();
        if ($config) {
            $config->valore = $data['valore'];
            $config->save();
        } else {
            $config = Configurazione::create($data);
        }
        return response()->json($config);
    }
}
