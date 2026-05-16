<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffBreak extends Model
{
    protected $table = 'staff_breaks';

    protected $fillable = [
        'event_staff_id',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at'   => 'datetime',
    ];

    public function eventStaff()
    {
        return $this->belongsTo(EventStaff::class, 'event_staff_id');
    }
}
