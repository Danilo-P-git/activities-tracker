<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventShift extends Model
{
    protected $table = 'event_shifts';

    protected $fillable = ['event_id', 'starts_at', 'ends_at'];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
