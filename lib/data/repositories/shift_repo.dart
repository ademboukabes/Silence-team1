import '../providers/shift_provider.dart';

class ShiftRepo {
  final ShiftProvider _provider;
  ShiftRepo(this._provider);

  Future<List<dynamic>> list() {
    return _provider.list();
  }
}
