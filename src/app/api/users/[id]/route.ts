export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const normalizedId = String(id ?? '').trim()
    if (!normalizedId || normalizedId === 'undefined' || normalizedId === 'null') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const data: any = {}
    if (body.name)     data.name = body.name
    if (body.email)    data.email = body.email
    if (body.role)     data.role = body.role
    if (body.password) data.password = await bcrypt.hash(body.password, 12)

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: normalizedId },
      data,
      select: { id: true, name: true, email: true, role: true },
    })
    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const normalizedId = String(id ?? '').trim()
    if (!normalizedId || normalizedId === 'undefined' || normalizedId === 'null') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (normalizedId === session.id) {
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีตัวเองได้' }, { status: 400 })
    }

    await prisma.meeting.deleteMany({ where: { createdBy: normalizedId } })
    await prisma.user.delete({ where: { id: normalizedId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
