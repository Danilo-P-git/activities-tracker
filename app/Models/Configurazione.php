<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configurazione extends Model
{
    protected $table = 'configurazioni';
    protected $fillable = [
        'chiave',
        'valore',
    ];
    public $timestamps = false;

    // Helper statico per ottenere tutte le configurazioni come array associativo
    public static function getAllAssoc()
    {
        return self::all()->pluck('valore', 'chiave')->toArray();
    }

    // Helper per ottenere una configurazione per chiave
    public static function getValue($chiave, $default = null)
    {
        $row = self::where('chiave', $chiave)->first();
        return $row ? $row->valore : $default;
    }
}
